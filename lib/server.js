
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

export function registerServerHandler(port) {
  // Declare a route
  fastify.get('/api/status', async (request, reply) => {
    return { hello: 'world' }
  })

  // Run the server!
  const start = async () => {
    try {
      await fastify.listen({ port })
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  start()

  return fastify
}
