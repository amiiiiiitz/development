# Backend setup

The backend requires a `JWT_SECRET` environment variable containing at least 32 characters. Keep this value private and do not commit it.

From this directory, set the variable and start the server:

```powershell
$env:JWT_SECRET = "<generate-a-private-secret-at-least-32-characters-long>"
npm start
```

In a POSIX shell:

```sh
JWT_SECRET="<generate-a-private-secret-at-least-32-characters-long>" npm start
```
