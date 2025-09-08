import { createContext, useContext } from 'react';
import useLocalStorage from './useLocalStorage.jsx';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

export const SettingsProvider = ({ children }) => {
    const [intervalTime, setIntervalTime] = useLocalStorage('intervalTime', 3600000 * (0) + 60000 * (2) + 1000 * (0));
    const [timerVisible, setTimerVisible] = useLocalStorage('timerVisible', true);
    const [progressBarVisible, setProgressBarVisible] = useLocalStorage('progressBarVisible', true);
    const [serverUrl, setServerUrl] = useLocalStorage('serverUrl','http://192.168.0.117:3001');

    const value = {
        intervalTime,
        setIntervalTime,
        timerVisible,
        setTimerVisible,
        progressBarVisible,
        setProgressBarVisible,
        serverUrl,
        setServerUrl,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )

}