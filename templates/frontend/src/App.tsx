import { BrowserRouter, Routes, Route } from "react-router";
import { HomePage } from "./features/home/HomePage.js";

/**
 * Root application component.
 *
 * Owns the router context and top-level route definitions.
 * Add new routes here as features are added.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
