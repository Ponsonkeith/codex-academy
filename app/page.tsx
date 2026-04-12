export default function Home() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <script>window.location.href='/landing.html'</script>
    ` }} />
  )
}