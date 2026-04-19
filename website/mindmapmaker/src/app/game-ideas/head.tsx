const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Head() {
  return (
    <>
      <link rel="stylesheet" href={`${basePath}/game-ideas.css`} />
    </>
  );
}
