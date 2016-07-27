export default class PartialFixture {
    constructor() {
        this.activate = sinon.spy();
        this.deactivate = sinon.spy();
    }
}
