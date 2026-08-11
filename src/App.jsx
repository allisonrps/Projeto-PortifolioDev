import './App.css'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Services from './components/Services/Services'
import Projects from './components/Projects/Projects'
import Studies from './components/Studies/Studies'
import Contact from './components/Contact/Contact'
import TechBackground from './components/common/TechBackground'

function App() {
  return (
    <div className="app">
      <TechBackground />
      <Header />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <About />
        <Services />
        <Projects />
        <Studies />
        <Contact />
      </main>
    </div>
  )
}

export default App
