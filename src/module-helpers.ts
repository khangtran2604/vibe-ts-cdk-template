import type { ModuleConfig, ProtectedEndpoints } from "./types.js";

/**
 * Converts a kebab-case string to PascalCase.
 *
 * @param kebab - A kebab-case string (e.g. "order-items").
 * @returns The PascalCase equivalent (e.g. "OrderItems").
 *
 * @example
 * toPascalCase("order-items") // => "OrderItems"
 * toPascalCase("orders")      // => "Orders"
 */
export function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

/**
 * Converts a kebab-case string to a PascalCase singular entity name.
 *
 * Singularization is intentionally simple: strip a trailing "s" unless the
 * word ends with "ss" (e.g. "Statuses" → "Status", not "Statu").
 *
 * @param kebab - A kebab-case plural noun (e.g. "order-items").
 * @returns The PascalCase singular form (e.g. "OrderItem").
 *
 * @example
 * toEntityName("order-items") // => "OrderItem"
 * toEntityName("orders")      // => "Order"
 * toEntityName("statuses")    // => "Status"
 */
export function toEntityName(kebab: string): string {
  const pascal = toPascalCase(kebab);
  // Intentionally simple singularization — handles the most common patterns
  // without pulling in a full inflection library.
  if (pascal.endsWith("ss")) return pascal;
  if (pascal.endsWith("ies")) return pascal.slice(0, -3) + "y";
  if (pascal.endsWith("ses") || pascal.endsWith("xes") || pascal.endsWith("zes"))
    return pascal.slice(0, -2);
  if (pascal.endsWith("s")) return pascal.slice(0, -1);
  return pascal;
}

/**
 * Like {@link toEntityName} but returns camelCase (first character lowercased).
 *
 * @param kebab - A kebab-case plural noun (e.g. "order-items").
 * @returns The camelCase singular form (e.g. "orderItem").
 *
 * @example
 * toEntityNameLower("order-items") // => "orderItem"
 * toEntityNameLower("orders")      // => "order"
 */
export function toEntityNameLower(kebab: string): string {
  const entity = toEntityName(kebab);
  return entity.charAt(0).toLowerCase() + entity.slice(1);
}

/**
 * Removes all hyphens from a kebab-case string and lowercases the result.
 *
 * Useful for generating identifiers such as DynamoDB table names or plain
 * lowercase type discriminators.
 *
 * @param kebab - A kebab-case string (e.g. "order-items").
 * @returns The flat lowercase form (e.g. "orderitems").
 *
 * @example
 * toFlatLower("order-items") // => "orderitems"
 * toFlatLower("orders")      // => "orders"
 */
export function toFlatLower(kebab: string): string {
  return kebab.replaceAll("-", "").toLowerCase();
}

/**
 * Builds the variable substitution map used by the module generator when
 * processing `.hbs` template files.  Every `{{key}}` placeholder in a module
 * template must have a corresponding entry here.
 *
 * All values are strings because the substitution mechanism uses
 * `String.replaceAll("{{key}}", value)`.
 *
 * @param config - The fully-resolved module configuration.
 * @returns A record mapping placeholder names to their replacement strings.
 *
 * @example
 * getModuleVariableMap({
 *   moduleName: "order-items",
 *   entityName: "OrderItem",
 *   port: 3003,
 *   projectName: "my-app",
 *   ...
 * })
 * // => {
 * //   moduleName:      "order-items",
 * //   ModuleName:      "OrderItems",
 * //   entityName:      "OrderItem",
 * //   EntityName:      "OrderItem",
 * //   entityNameLower: "orderItem",
 * //   flatLower:       "orderitems",
 * //   port:            "3003",
 * //   projectName:     "my-app",
 * // }
 */
export function getModuleVariableMap(config: ModuleConfig): Record<string, string> {
  const pe = config.protectedEndpoints;
  const hasAnyProtected = pe != null && Object.values(pe).some(Boolean);

  return {
    // authorizerSetup must come before ModuleName and projectName so that
    // the {{ModuleName}} and {{projectName}} placeholders it embeds are
    // resolved when replaceVariables() processes those keys later.
    authorizerSetup: hasAnyProtected ? buildAuthorizerSetup() : "",
    listAuthOptions: authMethodOptions(pe?.list),
    getAuthOptions: authMethodOptions(pe?.get),
    createAuthOptions: authMethodOptions(pe?.create),
    updateAuthOptions: authMethodOptions(pe?.update),
    deleteAuthOptions: authMethodOptions(pe?.delete),
    moduleName: config.moduleName,
    ModuleName: toPascalCase(config.moduleName),
    entityName: config.entityName,
    EntityName: config.entityName,
    entityNameLower: config.entityName.charAt(0).toLowerCase() + config.entityName.slice(1),
    flatLower: toFlatLower(config.moduleName),
    port: String(config.port),
    projectName: config.projectName,
  };
}

/**
 * Returns the CDK method-options snippet that attaches a token authorizer to
 * an API Gateway method.  When the endpoint is not protected, returns an
 * empty string so the `addMethod` call remains unchanged.
 */
function authMethodOptions(isProtected?: boolean): string {
  if (!isProtected) return "";
  return [
    ",",
    "      {",
    "        authorizer,",
    "        authorizationType: apigateway.AuthorizationType.CUSTOM,",
    "      }",
  ].join("\n");
}

/**
 * Returns the CDK block that imports the Cognito authorizer Lambda from the
 * AuthStack via `CfnOutput` and creates a `TokenAuthorizer`.
 *
 * The returned string intentionally contains `{{projectName}}` and
 * `{{ModuleName}}` placeholders — they are resolved in the same `replaceAll`
 * pass that processes all other template variables.
 */
function buildAuthorizerSetup(): string {
  return [
    "",
    "    const authorizerFnArn = cdk.Fn.importValue(",
    '      `{{projectName}}-AuthorizerFunctionArn-${this.stage}`',
    "    );",
    "    const authorizerFn = lambda.Function.fromFunctionArn(",
    '      this, "ImportedAuthorizerFunction", authorizerFnArn',
    "    );",
    '    const authorizer = new apigateway.TokenAuthorizer(this, "{{ModuleName}}Authorizer", {',
    "      handler: authorizerFn,",
    '      identitySource: "method.request.header.Authorization",',
    "    });",
  ].join("\n");
}

/**
 * Inserts `newLine` immediately before the line containing `marker` in
 * `content`, leaving the marker line intact so future injections can target
 * the same marker again.
 *
 * The indentation of the marker line is applied to `newLine` so the inserted
 * content aligns correctly regardless of the surrounding code style.
 *
 * @param content - The full file content to modify.
 * @param marker  - A substring that uniquely identifies the target line.
 * @param newLine - The line to insert (without a trailing newline; one is added
 *                  automatically).
 * @returns The modified content with `newLine` inserted before the marker line.
 * @throws {Error} If `marker` is not found in `content`.
 *
 * @example
 * const content = `const routes = [\n  // @inject:routes\n];\n`;
 * injectBeforeMarker(content, "// @inject:routes", "  { path: '/orders', handler: ordersHandler },");
 * // =>
 * // const routes = [
 * //   { path: '/orders', handler: ordersHandler },
 * //   // @inject:routes
 * // ];
 */
export function injectBeforeMarker(
  content: string,
  marker: string,
  newLine: string,
): string {
  const lines = content.split("\n");
  const markerIndex = lines.findIndex((line) => line.includes(marker));

  if (markerIndex === -1) {
    throw new Error(
      `injectBeforeMarker: marker "${marker}" was not found in the provided content.`,
    );
  }

  // Capture leading whitespace from the marker line and apply it to the
  // inserted line so the new content respects the surrounding indentation.
  const markerLine = lines[markerIndex]!;
  const leadingWhitespace = markerLine.match(/^(\s*)/)?.[1] ?? "";
  const indentedNewLine = leadingWhitespace + newLine.trimStart();

  lines.splice(markerIndex, 0, indentedNewLine);
  return lines.join("\n");
}
