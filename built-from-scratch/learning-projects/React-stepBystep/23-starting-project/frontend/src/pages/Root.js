import { Outlet, useLoaderData, useNavigation, useSubmit } from 'react-router-dom';
import { getTokenDuration } from '../util/auth';
import { useEffect } from 'react';
import MainNavigation from '../components/MainNavigation';

function RootLayout() {
  const token = useLoaderData();
  const submit = useSubmit();
  // const navigation = useNavigation();

  useEffect(() => {
    if(!token) {
      return; // No token, no need to check authentication
    }

    if (token === "EXPIRED") {
      submit(null, { method: 'post', action: '/logout' });
      return;
    }

    const tokenDuration = getTokenDuration();

    setTimeout(() => {
      submit(null, { method: 'post', action: '/check-auth' });
    }, tokenDuration); // Check authentication every hour
  }, [token, submit]); // we are doin it bcz backend will invalidate the token after 1 hour, so we need to check if the token is still valid and if not, we need to logout the user

  return (
    <>
      <MainNavigation />
      <main>
        {/* {navigation.state === 'loading' && <p>Loading...</p>} */}
        <Outlet />
      </main>
    </>
  );
}

export default RootLayout;
