import MainNavigation from "../components/MainNavigation";
import { Outlet, useNavigation } from "react-router-dom";

function Root() {
  // const navigation = useNavigation();

  // navigation.state === "loading" && <p>Loading...</p>; // the loading indicator wont be added which you are transitioning to but instead some page or component which is already visbile on the screen when the transitin is started. So if you are on the home page and you click on the events link then the loading indicator will be shown on the home page and not on the events page. This is because the events page is not yet visible when the transition starts. So the loading indicator will be shown on the home page until the events page is loaded and then it will be removed.
  return (
    <div className="root">
      <MainNavigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Root;
