# Thanksgiving at Home · 2026

## Run locally

1. In Visual Studio Code choose **File > Open Folder**. In Visual Studio choose **File > Open > Folder**. Select this Thanksgiving-2026 folder.
2. Open the terminal in the editor and run **node server.cjs**. Node.js needs to be installed. The app has no packages to install.
3. Open **http://127.0.0.1:8080** in Edge, Chrome, or another current browser. Keep the terminal running while using the app. Press Ctrl+C in the terminal to stop it.

Keep the same browser profile and URL so the browser can find your saved settings and checkmarks. The app is local to this computer. You can also open index.html directly for a quick look. For consistent shopping persistence and clipboard access, use the local server.

If port 8080 is busy, run the following in PowerShell and open the URL printed by the server.

    $env:THANKSGIVING_PORT = '8081'
    node server.cjs

## Use the plan

- **Menu** opens the eight recipe pages. Each has prep and cooking steps you can check off.
- **Shopping** combines ingredients and supplies. Use **Print / Save as PDF**, **Copy for Apple Notes**, or **Download Notes text**. Paste the copied text into a note, or use **File > Import to Notes** on a Mac to import the downloaded TXT. The export preserves checkmarks as text symbols. The live checkboxes are in the web app.
- **Timeline** separates advance prep, Wednesday, and Thursday. Check off completed tasks, use **By appliance** to see bookings, and open **Cooking mode** for current and next tasks. A link in each task jumps to the relevant recipe step.
- **Kitchen checks** includes cooler brining, food temperatures, and the thermometer checklist.
- **Turkey weight** starts at 14 lb. Changing it updates the bird, estimated brine and injection quantities, shopping list, and thawing and grill schedule. Check the loaded spit clearance before cooking.
- The sides use a 1.5× batch for about 12–15 side portions, planned for 10 adults and 5–6 young children. The Ninja schedule budgets two shallow mac and cheese pans and up to four bread batches. It starts with three stovetop burners and a separate setup that can hold food at 140°F or above.

The earlier chat provided the green beans, carrots, bread and salad recipes. The turkey, gravy, rice and mac and cheese pages are labeled reconstructions from the available menu notes and refinements.

## Español

En el encabezado, pulsa **EN / ES** para cambiar el idioma de toda la aplicación. El navegador recuerda tu idioma, el peso del pavo y tus marcas. La impresión y la lista para Notas de Apple salen en el idioma que estés usando.

Para abrir la aplicación, extrae el ZIP. Abre la carpeta Thanksgiving-2026 desde el menú **Archivo** en Visual Studio o VS Code. Abre la terminal, ejecuta **node server.cjs** y entra a **http://127.0.0.1:8080** en tu navegador. Se necesita Node.js. Para conservar tus marcas, usa el mismo navegador, perfil y dirección de antes. Presiona Ctrl+C en la terminal para detener la aplicación.

Si ya tenías una versión anterior, detén el servidor. Copia todos los archivos de la nueva carpeta a la carpeta que abriste en Visual Studio y acepta reemplazar los archivos existentes. Vuelve a ejecutar **node server.cjs** y recarga la página. Si el puerto 8080 está ocupado, puedes elegir otro, pero cada dirección guarda sus propias marcas.

- **Menú** abre las ocho recetas con listas para marcar los pasos. El pavo empieza en 14 lb y puedes cambiar el peso. Los acompañamientos están calculados para 10 adultos y 5–6 niños.
- **Compras** reúne los ingredientes. Puedes imprimir, guardar en PDF, copiar para Notas de Apple o descargar la lista en texto. En una Mac, importa el archivo TXT desde **Archivo > Importar a Notas**. Las marcas exportadas son símbolos de texto.
- **Cronograma** reúne la descongelación, el día de preparación y el día de cocinar. El plan empieza con tres quemadores, la Weber y la Ninja SP101, más un equipo aparte para mantener la comida a 140 °F o más. Imprime el plan completo o un solo día.
- **Seguridad en la cocina** incluye el manejo de la salmuera y las verificaciones con el termómetro.

Las recetas de pavo, salsa, arroz y coditos se reconstruyeron a partir de las notas disponibles. El chat anterior sí incluía las recetas de habichuelas, zanahorias, pan de ajo y ensalada.


## Appliance scheduling and printing

- On **Timeline**, set the number of available burners (three by default). The Thursday occupancy chart shades the final 90 minutes and marks conflicting bookings. Use **By appliance** to see the bookings grouped by equipment.
- Open **Adjust time** on a task to change its start and duration. The stovetop mac-and-cheese task can also use one burner if you plan to cook the pasta and sauce sequentially. Allow extra time in that case. **Reset timing** restores that task’s default.
- The planner flags overlapping appliance bookings, burner demand above capacity, tasks out of dependency order, and Thursday tasks running past 6 PM. Suggested times are advisory and never change a booking. Gravy and carving still depend on when the turkey is actually done.
- **Cooking mode** shows active tasks, the next two tasks, and any overdue items. “In progress” follows the device clock and your planned time slots. Completion requires a checkmark. Timing changes, burner capacity and progress are saved in this browser.
- Open **Print Cooking Plan** from the menu or timeline. Select a complete schedule, specific days, equipment, recipes, or shopping, then choose **Print selected sections**. Pick Letter or A4 in the print dialog, or select **Save as PDF**. Printed tasks and grocery items include empty boxes for marking by hand. The printout uses your current language.
- Recipes show fractions in their ingredient lists and directions. Turkey amounts in the directions update from the same scaled quantities as the ingredient list.

## Horarios de los equipos e impresión

- En **Cronograma**, ajusta los quemadores disponibles. El plan empieza con tres. El gráfico del jueves sombrea los últimos 90 minutos y marca los cruces. En **Por equipo**, puedes ver los turnos de cada aparato.
- Abre **Ajustar el horario** en una tarea para cambiar el inicio y la duración. Puedes asignar un solo quemador a los coditos si vas a cocinar la pasta y la salsa por separado. En ese caso, calcula más tiempo. **Restablecer el horario** devuelve la tarea a su turno original.
- El plan avisa si se cruzan turnos, faltan quemadores, una tarea empieza antes de que termine otra de la que depende, o una tarea del jueves termina después de las 6 p. m. Las sugerencias no cambian el horario. Prepara la salsa cuando el pavo salga de la parrilla.
- **Modo cocina** muestra las tareas en curso y las dos que siguen. El estado se calcula con el reloj de tu dispositivo. Marca cada tarea cuando termines. El navegador guarda tus marcas y ajustes.
- Abre **Imprimir el plan de cocina** desde el menú o el cronograma. Escoge las secciones y pulsa **Imprimir las secciones seleccionadas**. Elige papel carta, A4 o guardar en PDF. Las casillas impresas quedan listas para marcar a mano. Se imprime en el idioma seleccionado.
- Las cantidades de las recetas se muestran en fracciones, también en los pasos. Si cambias el peso del pavo, se ajustan ambas.
