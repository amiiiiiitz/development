import Login from "./Login";
import { useState } from "react";
import MainPage from "./MainPage";

export default function App () {
    const [visibility, setVisibility] = useState(false);

    function handleChange () {
        setVisibility(true);
    }
    return (
        <>
        {!visibility && <Login onChange = {handleChange} visibility = {visibility}/>}
        {visibility && <MainPage title = 'create project' />}
        </>
    );
}