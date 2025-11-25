import PostDetail from "@/components/post-detail";

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  // `params` can be a Promise in some Next.js configs; await to unwrap.
  const p = await params;
  const id = p?.id;

  return (
    <div className="min-h-screen">
      <PostDetail id={id} />
    </div>
  );
}
