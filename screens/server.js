// Importa o framework e ativa o logger para ver o que acontece no terminal
const fastify = require('fastify')({ logger: true })

// Define uma rota simples
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

// Função para iniciar o servidor
const start = async () => {
  try {
    // O servidor escuta na porta 3000 por padrão
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
