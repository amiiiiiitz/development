import { Link } from "react-router-dom";

function HomePage() {
  // useNavigation is a hook provided by react-router-dom that allows us to navigate to different pages programmatically. it returns a function that we can call to navigate to a different page. we can pass the path of the page we want to navigate to as an argument to the function returned by useNavigation. it is useful when we want to navigate to a different page after performing some action like submitting a form or after a successful login.
  
  return (
    <>
      <h1>Home Page</h1> 
			{/* Link component is used to navigate to different pages without reloading the page. It is a client-side navigation. it dont sent a request to the server, it just changes the URL and renders the component associated with that URL. */}
      <p>
        go to the <Link to="products">Products</Link> page. 
      </p>
    </>
  );
}

export default HomePage;
