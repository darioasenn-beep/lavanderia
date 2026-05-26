import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export default async function BolsaPage({ params }: Props) {
  const { id } = await params
  redirect(`/q/${id}`)
}
