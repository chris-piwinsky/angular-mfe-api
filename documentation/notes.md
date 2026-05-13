# Scratchpad/Notes of my thoughts

## Micro Frontend (MFE's) notes

https://blog.codinghorror.com/falling-into-the-pit-of-success/

- "a well-designed system makes it easy to do the right things and annoying (but not impossible) to do the wrong things."

- "If our engineers aren’t finding success on their own – or if they’re not finding it within a reasonable amount of time – it’s not their fault. It’s our fault."

- GUI = "HEAD" when it comes to understanding headless api's.  so HEADLESS infers a decoupling of the UI to API. Means an API is designed without a specific GUI "head" or "frontend" in mind

- in traditional style (State Farm) api's and UI's were designed in tandom.  this inhibited a headless approach and tightly coupled our UI teams with our api teams.  actually it meant the UI team would "OWN" the api as well thus limiting that scope of the api to what the UI wanted/needed.

- we want to develop our API's in billing and payments to be more standardized and decoupled from our UI's so we can not only provide a standard set of services within our area but also throughout not only our organization but also outside our organization B2B2C

- Headless APIs assist this by making fewer assumptions about how they are used and trying to remain independent of the frontend language,

- Avoid making assumptions about how the api will be used

- since decoupling caching and caching strategy at the UI, BFF layer will become more important b/c of response times we will need to achieve.  I consider this an opportunity esp with the API's we have now and their slowness...we can look for ways to improve this with caching and maybe reduce some of our API calls.

- build vs buy vs assemble: with recent direction and new C suite changes it appears state farm is moving away from the buy and more to the build/assemble when applicable.  we still have vendors but i think this is covered in our principles as keeping them separated from our headless api layer and more to the system level so we can easily move from one to the other making vendor lock in harder for us.

- MFE Once one team has had the experience of getting a feature all the way to production with little modification to the old world, other teams will want to join the new world as well.  We have started this with our payment methods component so a POC is out there and pattern for other teams to follow.

- MFE not a substitute for CLEAN CODE!

- We want to make it HARDER to make bad decisions!

- How can we make it easy for teams to fall into success.  API strategy, code reviews, spectral, automation, templated designs.

- Similarly, micro frontends (MFE's) push you to be explicit and deliberate about how data and events flow between different parts of the application, which is something that we should have been doing anyway!

- Regardless of how or where your frontend code is hosted, each micro frontend should have its own continuous delivery pipeline, which builds, tests and deploys it all the way to production. We should be able to deploy each micro frontend with very little thought given to the current state of other codebases or pipelines. 

- MFE if we are decoupling our code lets no reintroduce release dependencies.  IE have to update to new version anytime a change is done on the micro frontend component in an HOST UI (application) - Use Run-time integration via JavaScript

- MFE for styling we will want to follow SFDS standards/compliance

- MFE: Whatever approach we choose, we want our micro frontends to communicate by sending messages or events to each other, and avoid having any shared state. 

- MFE: The guiding principle here is that the team building a particular micro frontend shouldn't have to wait for other teams to build things for them.

- Auth: usually falls firmly in the category of cross-cutting concerns that should be owned by the container application.  Feels like this should be pretty standard as we get to merna and patterns will be available.  we already have done some of this with the payment-methods component for UPP.

- MFE: The key principles of micro frontends include componentization, independent development and deployment, technology diversity, and team autonomy. These principles enable teams to work on different parts of the application simultaneously, leveraging their preferred technologies and frameworks.

- Approaches like URL routing, path-based routing, or a centralized router can help maintain a coherent user experience across different micro frontends.  I feel this fits in with our API first strategy and making sure we have well thought out contracts with our API's so our MFE's can be consistent

- With MFE's we need to have a well defined API headless ecosystem.  This way as requirements are built up over time on the MFE's their should be a good start on an existing headless api to get their data they are after.  obviously will be filtered by the bff or what not.

- create a reasonable level of alignment between the various teams this should help enable collaboration and sharing between them.

## Challenges on MFE approach

- Team Skill sets and Knowledge Sharing: i think we can mitigate this with AI skills to help with enabling the scaffolding. Also, offering training for teams moving from our current tech stack to our more narrow tech stack with MERNA will really help mitigate this.

- Ensuring Consistency in User Experience: a new effort has been spun up for MERNA nad Unified insurance platform for our UX resources to help start developing this consistency across all areas so we will hae special focus on Billing and Payments.  Engineering will also be in the room for these discussions as a check to make sure we are not introducing issues/limiations based on our tech stack and infrastructure.

- Maintaining Compatibility and Versioning: having common templates and approaches for this will help drive out a versioning strategy we can use maintain


## Backend For Frontend (BFF) notes

- Services Return Domain Data, Not Screen Data (The service owns the domain. The UI owns the presentation.) - how would we define the domains in billing and payments?  i would imagine we talk to the biz archs on the domains.  

- for BFF when you see the shape of the data you will need to ask is this "shape" specific to the UI (BFF) or Domain (API).

- A BFF doesn’t magically make old mobile apps support new screens. It just gives you more room to change the data contract behind an existing screen

- An API gateway (headless) is usually general-purpose. A BFF is specific to one frontend experience.
  - API gateway: shared edge concerns
  - BFF: UI-specific composition

- I think this statement really helps sell the need for BFF's and how they can be used within billing and payments:
    "Then mobile wants a compact response because the screen only shows a small card. Web wants a larger response because it shows a full page. Later the tablet app wants something in between. Then one client wants extra recommendation data. Another wants stock warnings included. Another does not."

    - it seemed like in billing and payments anytime we had another request for a different view it would equal a new API.  if we follow MFE and BFF in this approach we could have our API's return a larger amount of data and the BFF would narrow down based on the frontend experience we would desire.

- In some systems, GraphQL is basically the BFF. In others, each BFF calls GraphQL.  I think this is an interesting point especially as the unified insurance platform grows and graphql is implemented.  Will our schemas be our BFF in our graph instead of developing an individualized BFF for our MFE's

- Great point: You accept some extra backend surface area in exchange for clearer ownership and a better API for that frontend.

- Depending on scope of BFF it can live in the UI code or as a seperate 'api' to render the data specific for that frontend.  "Give the UI a small server-side companion when that helps."

- Some duplication of BFF's is fine.  This would be duplication across service boundaries not duplication within code bases.
 quote: "If it is a real business rule, then yes, it probably hurts. But then the answer may not be a shared BFF library. The answer may be to move that rule into the domain service that should own it."

- This is where Conway’s law shows up. Systems tend to follow team structure. So a good BFF boundary is often the team boundary.

- I would consider a BFF when:
  - a frontend screen needs data from multiple backend services
  - different clients need meaningfully different response shapes
  - mobile apps need a stable, tailored contract that can evolve server-side
  - the UI team often waits for a shared gateway/backend team
  - the data shaping is clearly UI-specific
  - you already have a server-side place close to the UI, for example Next.js Route Handlers

Summary:

If the honest answer is “this logic exists only because this UI needs it”, a BFF is worth considering.

If the honest answer is “this is reusable backend behavior”, it probably belongs somewhere else.