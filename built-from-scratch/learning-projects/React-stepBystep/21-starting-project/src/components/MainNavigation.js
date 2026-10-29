import { NavLink } from "react-router-dom";
import classes from "./MainNavigation.module.css";

function MainNavigation() {
  return (
    <header className={classes.header}>
      <nav>
        <ul className={classes.list}>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? classes.active : undefined
              } // here navlink similar to link but it has some additional features like it can automatically add active class to the link when it is active. isactive automatically returns by navlink when the link is active. we can use it to add active class to the link when it is active. if the link is active then it will return true and if it is not active then it will return false. so we can use it to add active class to the link when it is active.
              end // end is used to tell navlink that this link should be active only when the path is exactly the same as the path of the link. if we dont use end then this link will be active for all the paths that starts with the url given on the to. so if we want this link to be active only when the path is exactly the same as the path of the link then we have to use end. 
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? classes.active : undefined
              }
            >
              Products
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
