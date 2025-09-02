import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animaciones para el logo y texto
  const logoScale = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  const progressWidth = new Animated.Value(0);

  useEffect(() => {
    // Función para cerrar sesión si existe una sesión activa
    const cerrarSesionSiExiste = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          console.log('🚪 Usuario loggeado encontrado, cerrando sesión:', user.email);
          await signOut(auth);
          console.log('✅ Sesión cerrada exitosamente');
        } else {
          console.log('ℹ️ No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        // Continuar con la navegación aunque haya error
      }
    };

    // Secuencia de animaciones CON navegación forzada al Login
    const animateAndNavigate = async () => {
      console.log('🎬 Iniciando secuencia de Splash Screen');
      
      // 1. Cerrar sesión existente (si la hay)
      await cerrarSesionSiExiste();

      // 2. Animar el logo (escala)
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // 3. Animar el texto (opacidad) después de 400ms
      setTimeout(() => {
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 400);

      // 4. Animar la barra de progreso después de 800ms
      setTimeout(() => {
        Animated.timing(progressWidth, {
          toValue: width * 0.8,
          duration: 1500,
          useNativeDriver: false,
        }).start();
      }, 800);

      // 5. ✅ NAVEGACIÓN FORZADA AL LOGIN después de 3 segundos
      setTimeout(() => {
        console.log('🚀 Redirigiendo FORZADAMENTE al Login');
        // Usar replace para que no se pueda volver al splash
        navigation.replace('Login');
      }, 3000);
    };

    animateAndNavigate();
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo animado */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>👤</Text>
          </View>
        </Animated.View>

        {/* Título de la app */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: textOpacity
            }
          ]}
        >
          <Text style={styles.title}>UserAuth</Text>
          <Text style={styles.subtitle}>Gestión de Usuarios</Text>
        </Animated.View>

        {/* Barra de progreso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressWidth
                }
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Iniciando aplicación...</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Firebase Auth</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
        <Text style={styles.debugText}>Modo: Siempre Login</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  logoText: {
    fontSize: 48,
    color: '#fff',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '300',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: width * 0.8,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '300',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginBottom: 4,
  },
  debugText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontStyle: 'italic',
  },
});

export default SplashScreen;