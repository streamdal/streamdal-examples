# Example Streamdal User Onboarding PII Masking App


This is an example Typescript Prisma Next app that shows how to instrument 
your code with the **[Streamdal](https://github.com/streamdal/streamdal/)** node-sdk
for the purpose of masking PII:

### Getting Started:

```
npm install
```

##### Setup `.env`

```
 cp ./.env.example ./.env
```

##### Create and seed the database

Requires Docker.

```
npm run db:up
```

##### Initialize the DB.
```
npx prisma migrate dev --name init
```

##### Run the app
``` 
npm run dev
```
