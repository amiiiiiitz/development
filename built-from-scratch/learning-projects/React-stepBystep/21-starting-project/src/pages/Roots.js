import { Outlet } from "react-router-dom";
import MainNavigation from "../components/MainNavigation";

	
function Roots() {
	return (
		<>
			<MainNavigation />
			<main>
				<Outlet />  
				{/* Outlet component is used to render the child routes. It is a placeholder for the child routes. It will render the component associated with the child route. */}
			</main>
		</>
	);
}

export default Roots;