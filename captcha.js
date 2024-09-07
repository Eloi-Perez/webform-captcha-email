import { createChallenge } from 'altcha-lib'

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify, options) {
  fastify.get('/captcha-challenge', async (request, reply) => {

    // Create a new challenge and send it to the client:
    const challenge = await createChallenge({
      hmacKey: process.env.HMACKEY,
      expires: new Date(Date.now() + 3600000),
      maxNumber: 10000, // the maximum random number
    })
    return challenge // reply.send({})
  })

}

export default routes
