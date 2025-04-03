import './App.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Canvas from './components/Canvas/Canvas'

function App() {

  const router=createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/' element={<Canvas/>}/>
      </>
    )
  )

  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
