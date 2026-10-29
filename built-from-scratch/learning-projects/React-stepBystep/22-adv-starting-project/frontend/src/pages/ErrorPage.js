import { useRouteError } from "react-router-dom";
import PageContent from "../components/PageContent";

function ErrorPage() {
	const error = useRouteError();

	let title = "An error occurred!";
	let message = "Something went wrong!";

	if (error.status === 500) {
		title = "Server error!";
		message = JSON.parse(error.data).message; // here we are parsing the error data because we are sending the error data as a string from the loader function. and we are extracting the message from the error data and showing it on the error page.
	}
	if (error.status === 404) {
		title = "Not found!";
		message = "Could not find resource or page.";
	}
	return (
		<PageContent title={title}>
			<p>{message}</p>
		</PageContent>
	);
}

export default ErrorPage;