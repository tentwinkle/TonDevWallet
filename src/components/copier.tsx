import clipboard from 'clipboardy'
import { useState } from 'react'
import { Button } from './ui/button'
import CopySvg from './icons/copy'
import DoneSvg from './icons/done'

export default function Copier({
  text,
  className = 'w-6 h-6',
}: {
  text: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const pressCopy = () => {
    clipboard.write(text)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  return (
    <Button variant="ghost" className={className} onClick={pressCopy}>
      {copied ? <DoneSvg /> : <CopySvg className="text-red" />}
    </Button>
  )
}
