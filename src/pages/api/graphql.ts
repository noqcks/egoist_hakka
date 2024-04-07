import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-micro'
import { NextApiHandler } from 'next'
import { getSchema } from '@server/lib/graphql'
import { getServerSession } from '@server/lib/auth'
import connect from 'next-connect'
import cors from 'cors'

export const config = {
  api: {
    bodyParser: false,
  },
}

let handler: any

const isProd = process.env.NODE_ENV === 'production'

const apiHandler: NextApiHandler = async (req, res) => {
  if (handler && isProd) {
    return handler(req, res)
  }

  const schema = await getSchema()

  const apolloServer = new ApolloServer({
    schema,
    // The 'tracing' option is not supported in the latest ApolloServer config.
// The 'playground' option has been removed in the latest version of ApolloServer, so this block is deleted.
    introspection: true,
    async context({ req, res }) {
      const { user } = await getServerSession(req)
      return {
        req,
        res,
        user,
      }
    },
  })

  handler = apolloServer.createHandler({
    path: `/api/graphql`,
  })

  return handler(req, res)
}

export default connect()
  .use(cors())
  .use(apiHandler as any)
