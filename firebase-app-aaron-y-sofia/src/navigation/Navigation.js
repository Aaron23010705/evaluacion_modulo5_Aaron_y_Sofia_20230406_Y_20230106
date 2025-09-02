import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

// Importar las pantallas
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/Add';
import HomeScreen from '../screens/Home';
import EditProfileScreen from '../screens/EditEmpleado';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Escuchar cambios en el estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', !!user);
            setUser(user);
            setIsLoading(false);
        });

        // Timer para ocultar splash después de 3 segundos mínimo
        const splashTimer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);

        // Cleanup
        return () => {
            unsubscribe();
            clearTimeout(splashTimer);
        };
    }, []);

    // Mostrar Splash Screen mientras se verifica la autenticación O durante el tiempo mínimo
    if (isLoading || showSplash) {
        return (
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // Usuario autenticado - Pantallas principales
                    <>
                        <Stack.Screen 
                            name="Home" 
                            component={HomeScreen} 
                            options={{ title: 'Inicio' }} 
                        />
                        <Stack.Screen 
                            name="EditProfile" 
                            component={EditProfileScreen} 
                            options={{ 
                                title: 'Editar Perfil',
                                presentation: 'modal' 
                            }} 
                        />
                    </>
                ) : (
                    // Usuario no autenticado - Pantallas de autenticación
                    <>
                        <Stack.Screen 
                            name="Login" 
                            component={LoginScreen} 
                            options={{ title: 'Iniciar Sesión' }} 
                        />
                        <Stack.Screen 
                            name="Register" 
                            component={RegisterScreen} 
                            options={{ title: 'Registro' }} 
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;