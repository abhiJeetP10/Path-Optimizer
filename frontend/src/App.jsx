import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Map1 from './components/Map1'
import SavedRoutes from './components/SavedRoutes'
import {
  BrowserRouter,
  Route,
  Routes
} from "react-router-dom";

function App() {

  return (
    <div className="App">
    {/* <RoutesState> */}
     <BrowserRouter>
 
         <Routes>
           <Route exact path="/login" element={<Login />} />
           <Route exact path="/signup" element={<Register />} />
           <Route exact path="/" element={<Dashboard />} />
           <Route exact path="/map" element={<Map1 />} />
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
