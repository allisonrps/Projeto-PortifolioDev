import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header/Header'
import HeroAbout from './components/HeroAbout/HeroAbout'
import Services from './components/Services/Services'
import Projects from './components/Projects/Projects'
import Studies from './components/Studies/Studies'
import Contact from './components/Contact/Contact'
import TechBackground from './components/common/TechBackground'
import Preloader from './components/common/Preloader'
import { AnimatePresence } from 'framer-motion'

function App() {
  const [lang, setLang] = useState('pt') // 'pt' | 'en'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {loading && <Preloader />}
      </AnimatePresence>

      <TechBackground />
      <Header lang={lang} setLang={setLang} />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <HeroAbout lang={lang} />
        <Services lang={lang} />
        <Projects lang={lang} />
        <Studies lang={lang} />
        <Contact lang={lang} />
      </main>
    </div>
  )
}

export default App
