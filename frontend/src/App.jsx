import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Map1 from './components/Map1'
import SavedRoutes from './components/SavedRoutes'
import Map2 from './components/Map2'
import {
  BrowserRouter,
  Route,
  Routes
} from "react-router-dom";

function App() {

  return (
    <div className="App bg-black h-screen">
    {/* <RoutesState> */}
     <BrowserRouter>
 
         <Routes>
           <Route exact path="/login" element={<Login />} />
           <Route exact path="/Register" element={<Register />} />
           <Route exact path="/" element={<Dashboard />} />
           <Route exact path="/map1" element={<Map1 />} />
            <Route exact path="/map2" element={<Map2 />} />
           {/* <Route exact path="/showroute" element={<ShowRoute showAlert={showAlert}/>} /> */}
           {/* <Route exact path="/showonmap" element={<Showonmap showAlert={showAlert}/>} /> */}
            <Route exact path="/savedroutes" element={<SavedRoutes />} />
         </Routes>
       
     </BrowserRouter>
     {/* </RoutesState> */}
   </div>
  )
}

export default App
