import { redirect } from "react-router-dom";
import AuthForm from "../components/AuthForm";

function AuthenticationPage() {
  return <AuthForm />;
}

export default AuthenticationPage;

export async function action({ request }) {
  const mode = new URL(request.url).searchParams.get("mode") || "login";

  if (mode !== "login" && mode !== "signup") {
    throw new Error("Unsupported mode");
  }
  // console.log("MODE:", mode);

  const data = await request.formData();

  const authdata = {
    email: data.get("email"),
    password: data.get("password"),
  };

  

  // console.log("URL:", "http://localhost:8080/" + mode);

  const response = await fetch("http://localhost:8080/" + mode, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authdata),
  });

  // console.log("RESPONSE:", response);

  if (response.status === 401 || response.status === 422) {
    return response;
  }

  // console.log("before response.ok check");
  
  if (!response.ok) {
    throw new Response(JSON.stringify({ message: "Authentication failed." }), {
      status: 500,
    });
  }

  // console.log("STATUS:", response.status);

  const responseData = await response.json();
  const token = responseData.token;

  localStorage.setItem("token", token);

  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1);
  localStorage.setItem("expiration", expiration.toISOString());


  return redirect("/");
}
