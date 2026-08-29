import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toast } from "./components/Toast";
import { LocaleProvider } from "./i18n";
import { VenueProvider } from "./lib/venueStore";
import { Explore } from "./pages/Explore";
import { NotFound } from "./pages/NotFound";
import { PulseScreen } from "./pages/Pulse";
import { VenueDetail } from "./pages/VenueDetail";

export function App() {
  return (
    <LocaleProvider>
      <VenueProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Explore />}>
              <Route path="v/:id" element={<VenueDetail />}>
                <Route path="pulse" element={<PulseScreen />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toast />
        </BrowserRouter>
      </VenueProvider>
    </LocaleProvider>
  );
}
