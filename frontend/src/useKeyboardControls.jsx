import { useEffect} from "react"

const useKeyboardControls = (handlers) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if(Object.keys(handlers).includes(event.key)) {
                event.preventDefault();
            }
            console.log(event.key)
            if(handlers[event.key]) {
                handlers[event.key]()
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }

    }, [handlers])

}

export default useKeyboardControls