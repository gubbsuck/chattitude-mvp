import Head from 'next/head'
import ChattitudeGame from '../components/ChattitudeGame'

export default function Home() {
  return (
    <>
      <Head>
        <title>Chattitude - Konstruktiv debatt genom gamification</title>
        <meta name="description" content="AI-powered konstruktiv debatt träning" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChattitudeGame />
    </>
  )
}
