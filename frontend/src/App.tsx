import './App.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Canvas from './components/Canvas/Canvas'
import Home from './components/Home/Home'

function App() {

  const router=createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/' element={<Home/>}/>
        <Route path='/meta' element={<Canvas/>}/>
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
