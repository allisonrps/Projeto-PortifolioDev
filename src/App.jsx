import './App.css'
import Header from './components/Header/Header'
import HeroAbout from './components/HeroAbout/HeroAbout'
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
        <HeroAbout />
        <Services />
        <Projects />
        <Studies />
        <Contact />
      </main>
    </div>
  )
}

export default App
