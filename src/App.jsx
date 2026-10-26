import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Display from './pages/Display'
import Form from './pages/Form'
import FeedbackDisplay from './pages/FeedbackDisplay'
import FeedbackForm from './pages/FeedbackForm'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/emocion" element={<Display />} />
        <Route path="/emocion/enviar" element={<Form />} />
        <Route path="/opinion" element={<FeedbackDisplay />} />
        <Route path="/opinion/enviar" element={<FeedbackForm />} />
      </Routes>
    </BrowserRouter>
  )
}
