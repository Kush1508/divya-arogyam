import OverstoryStudioLanding from "./components/ui/overstory-studio-landing"

export default function App() {
  const handleBooking = (from?: string) => {
    let message = "Hello Dr. Sudhir Kumar / Divya Arogyam, I would like to start my healing journey and book a consultation."
    
    if (from?.startsWith("plan:")) {
      const planName = from.replace("plan:", "")
      message = `Hello Dr. Sudhir Kumar / Divya Arogyam, I would like to book the "${planName}" package and start my healing journey.`
    } else if (from === "work") {
      message = "Hello Dr. Sudhir Kumar / Divya Arogyam, I saw your recovery cases and would like to start my healing journey."
    }

    const whatsappUrl = `https://wa.me/916203315830?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <main className="min-h-screen">
      <OverstoryStudioLanding
        brand="Divya Arogyam"
        season="summer"
        onBook={handleBooking}
      />
    </main>
  )
}
