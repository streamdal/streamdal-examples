import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { Audience, OperationType, SDKResponse, Streamdal, StreamdalConfigs } from "@streamdal/node-sdk";
import { streamdal } from "../../../lib/streamdal";


const audience: Audience = {
  serviceName: "user-onboard-service",
  componentName: "postgresql",
  operationType: OperationType.PRODUCER,
  operationName: "user-creation",
};

// POST /api/user
// Required fields in body: name
// Optional fields in body: email
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const user = req.body;

  const streamdalResult: SDKResponse = await streamdal.process({
    audience,
    data: new TextEncoder().encode(JSON.stringify(user)),
  });
  console.log("shit streamdalResult", streamdalResult)

  const result = await prisma.user.create({
    data: JSON.parse(new TextDecoder().decode(streamdalResult.data)),
  });
  res.json(result);
}
