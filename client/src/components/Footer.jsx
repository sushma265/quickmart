export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} QuickMart — buy and sell near you.</span>
        <span className="muted">Meet in public places and inspect items before you pay.</span>
      </div>
    </footer>
  );
}
