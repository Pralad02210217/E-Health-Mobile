import React from "react";

import {
    View,
    Text,
    StyleSheet,
    useColorScheme
} from 'react-native'

function AppPro() : JSX.Element{
    const darkmode = useColorScheme() === 'dark'
    return(
        <View style={styles.container}>
            <Text style={darkmode ? styles.whiteText : styles.darkText}>Hello Testing here!!!!</Text>
        </View>
    )

}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    whiteText: {
        color: '#FFFFFF'
    },
    darkText: {
        color: '#000000'
    }

})


export default AppPro