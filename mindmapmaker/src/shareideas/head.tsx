const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function ShareIdeasHead() {
  return (
    <>
      <link rel="stylesheet" href={`${basePath}/shareideas.css`} />
    </>
  );
}
