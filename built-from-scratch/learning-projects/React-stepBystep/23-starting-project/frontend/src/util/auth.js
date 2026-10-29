import { redirect } from "react-router-dom";

export function getTokenDuration() {
	const expiration = localStorage.getItem("expiration");

	const expirationDate = new Date(expiration);
	const now = new Date();
	return expirationDate.getTime() - now.getTime();
}
export function getAuthToken() {
	const token = localStorage.getItem("token");
	const tokenDuration = getTokenDuration();

	if(!token) {
		return null;
	}
	if (tokenDuration < 0) {
		return "EXPIRED";
	}	

	return token;
}

export function tokenLoader() {
	return getAuthToken();
}

export function checkAuthLoader() {
	const token = getAuthToken();	

	console.log("before check auth loader");

	if (!token) {
		console.log("no token, redirecting to auth page");
		return redirect("/auth");	
	}

	return null;
}