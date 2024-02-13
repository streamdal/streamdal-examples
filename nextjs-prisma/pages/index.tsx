import React from "react";
import type { GetStaticProps } from "next";
import Layout from "../components/Layout";
import prisma from '../lib/prisma'

export const getStaticProps: GetStaticProps = async () => {
  const users = await prisma.user.findMany();
  return {
    props: {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }))
    },
    revalidate: 10,
  };
};

type Props = {
  users: [{
    id: number;
    name: string;
    email: string;
  }];
};

const Index: React.FC<Props> = (props) => {

  return (
    <Layout>
      <div>
        <main>
          {props.users?.length ?
            <>
              <h1 className="font-bold">Users:</h1>
              {props.users.map((user) => (
                <div key={user.id} className="border-b mb-2">
                  <div>
                    Name: {user.name}
                  </div>
                  <div>
                    Email: {user.email}
                  </div>
                </div>
              ))}
            </> :
            <div>No Users Yet</div>
          }
        </main>
      </div>
      <div className="mt-2 p-2 border rounded w-28">
        <a href="/create"> Add a user</a>
      </div>
    </Layout>
  );
};

export default Index;
