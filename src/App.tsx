import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import TrainerList from "@/pages/TrainerList";
import TrainerSchedule from "@/pages/TrainerSchedule";
import ScheduleCalendar from "@/pages/ScheduleCalendar";
import BookingList from "@/pages/BookingList";
import BookingNew from "@/pages/BookingNew";
import RateConfig from "@/pages/RateConfig";
import BillList from "@/pages/BillList";
import BillDetail from "@/pages/BillDetail";
import AssessmentList from "@/pages/AssessmentList";
import AssessmentNew from "@/pages/AssessmentNew";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trainers" element={<TrainerList />} />
          <Route path="/trainers/:id/schedule" element={<TrainerSchedule />} />
          <Route path="/schedule" element={<ScheduleCalendar />} />
          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/new" element={<BookingNew />} />
          <Route path="/rates" element={<RateConfig />} />
          <Route path="/bills" element={<BillList />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          <Route path="/assessments" element={<AssessmentList />} />
          <Route path="/assessments/new" element={<AssessmentNew />} />
        </Route>
      </Routes>
    </Router>
  );
}
