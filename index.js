import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import cors from '@fastify/cors'
import send from './send.js'
import captcha from './captcha.js'
import domains from './domains.json' with {type: 'json'}

const schema = {
  type: 'object',
  required: ['EMAIL_FROM', 'EMAIL_FROM_PASS'],
  properties: {
    PORT: {
      type: 'string'
    },
    EMAIL_FROM: {
      type: 'string'
    },
    EMAIL_FROM_PASS: {
      type: 'string'
    },
  }
}

const fastify = Fastify({
  logger: true
})

await fastify.register(fastifyEnv, { schema, dotenv: true })

await fastify.register(cors, {
  // options
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true)
      return
    }
    const hostname = new URL(origin).hostname
    console.log({ "hostname": hostname })
    if (hostname === "localhost" || domains.hasOwnProperty(hostname)) {
      //  Request from localhost will pass
      cb(null, true)
      return
    }
    // Generate an error on other origins, disabling access
    cb(new Error("Not allowed"), false)
  }
})

fastify.register(send, { prefix: '/api/v1' })
fastify.register(captcha, { prefix: '/api/v1' })

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    // with host: '0.0.0.0' the server will be able to listen on all network interfaces
    await fastify.listen({ port: process.env.PORT || 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()