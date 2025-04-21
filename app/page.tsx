import { Button } from "@/components/ui/button"
import { Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <Link href="/login">
        <Button>
          Login <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>

      <Link href="/admin">
        <Button variant={"outline"} className="ml-4">
          admin <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}