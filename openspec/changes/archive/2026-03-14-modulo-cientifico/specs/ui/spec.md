# UI Specification (Delta)

## ADDED Requirements

### Requirement: Research Sidebar

El sistema DEBE proporcionar una barra lateral o panel interactivo para realizar búsquedas académicas sin salir del editor principal.

#### Scenario: Opening the Research Sidebar
- GIVEN the user is in the main dashboard workspace.
- WHEN the user clicks on the "Investigación" button.
- THEN the system MUST display the Research Sidebar on the right side of the screen.
- AND it MUST contain a search input and a results area.

#### Scenario: Displaying academic results
- GIVEN the Research Sidebar is open.
- WHEN the user enters a search query and submits.
- THEN the system MUST display a list of articles with their titles and abstracts.
- AND each article MUST have a "Citar" or "Sintetizar" button.

### Requirement: APA 7 Styling Support

El sistema DEBE soportar la visualización y edición de textos con formato específico de APA 7ma Edición, incluyendo la sangría francesa para las referencias.

#### Scenario: Rendering references with hanging indent
- GIVEN a document containing a "Referencias" section.
- WHEN the editor renders this section.
- THEN it MUST apply a hanging indent of 1.5em to each paragraph in that section.
- AND the text alignment MUST follow standard APA formatting rules.
