import { useEffect, useRef } from "react";
import NoSleep from '@zakj/no-sleep'

const useNoSleep = (enabled) => {
    const noSleepRef = useRef(null);

    useEffect(() => {
        if(!noSleepRef.current) {
            noSleepRef.current = new NoSleep();
        }

        if(enabled) {
            noSleepRef.current.enable();
        } else {
            noSleepRef.current.disable();
        }

        return () => {
            if(noSleepRef.current && !enabled) {
                noSleepRef.current.disable();
            }
        }

    }, [enabled])
}
export default useNoSleep;