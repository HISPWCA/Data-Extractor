import { Route, Routes } from 'react-router-dom'
import DataExport from '../pages/DataExport'
import Error from '../pages/Error'
import Settings from '../pages/Settings'
import About from '../pages/About'

const AppRoutes = (
    <Routes>
        <Route path="/" element={<DataExport />} />
        <Route path="settings" element={<Settings />} />
        <Route path="data-export" element={<DataExport />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<Error />} />
    </Routes>
)

export default AppRoutes
