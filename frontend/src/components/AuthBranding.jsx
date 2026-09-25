// The decorative left-hand panel, extracted from Register.jsx so the additional
// auth pages (forgot password, reset, verify) can share it.
const characters = [
  {
    className: 'character character--purple',
    style: { left: '18%', top: '17%', width: '128px', height: '160px', animationDelay: '0s' },
    face: 'eyes',
  },
  {
    className: 'character character--dark',
    style: { right: '14%', top: '12%', width: '144px', height: '176px', animationDelay: '2s' },
    face: 'smile',
  },
  {
    className: 'character character--orange',
    style: { left: '26%', bottom: '26%', width: '160px', height: '80px', animationDelay: '1s' },
    face: 'eyes',
  },
  {
    className: 'character character--yellow',
    style: { right: '11%', bottom: '22%', width: '144px', height: '144px', animationDelay: '0.5s' },
    face: 'smile',
  },
]

export default function AuthBranding() {
  return (
    <section className="auth-branding" aria-label="Brand illustration">
      <div className="auth-branding__grid" aria-hidden="true" />
      <div className="auth-branding__stage">
        <div className="auth-branding__dot" aria-hidden="true" />
        {characters.map((character) => (
          <div key={character.className} className={`${character.className} float`} style={character.style}>
            {character.face === 'eyes' ? (
              <div className="character__eyes" aria-hidden="true">
                <span />
                <span />
              </div>
            ) : (
              <div className="character__smile" aria-hidden="true">
                <span />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="auth-branding__copy">A small, cheerful workspace for teams who like their tools with a bit of character.</p>
    </section>
  )
}
