import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Display from './pages/Display'
import Form from './pages/Form'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Display />} />
        <Route path="/submit" element={<Form />} />
      </Routes>
    </BrowserRouter>
  )
}
